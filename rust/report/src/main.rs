use std::path::Path;

use rusqlite::{params, Connection, Result};

const MANIFEST_DIR: &str = env!("CARGO_MANIFEST_DIR");

// ── Structs ───────────────────────────────────────────────────────────────────

/// One row from the Results table. Each row represents a single benchmark run.
#[derive(Debug)]
struct ResultRow {
    browser: String,
    test: String,
    param: i64,
    native: Option<f64>,
    single: Option<f64>,
    multi: Option<f64>,
}

/// One row in the Report table. Aggregated per (browser, test).
#[derive(Debug)]
struct ReportRow {
    browser: String,
    test: String,

    // Medians of per-param medians (after outlier removal)
    native_median: Option<f64>,
    single_median: Option<f64>,
    multi_median: Option<f64>,

    // Coefficient of Variation across per-param medians (stddev/mean * 100)
    native_cv: Option<f64>,
    single_cv: Option<f64>,
    multi_cv: Option<f64>,

    // Overhead ratios relative to native (>1 means WASM is slower)
    single_overhead: Option<f64>,
    multi_overhead: Option<f64>,

    // Threading benefit within WASM (single/multi — >1 means multi is faster)
    multi_vs_single_speedup: Option<f64>,

    // Input size range that was collapsed
    param_min: i64,
    param_max: i64,
}

// ── IQR outlier removal ───────────────────────────────────────────────────────

/// Removes outliers from a sorted slice using the 1.5×IQR rule.
/// Returns a new Vec with outliers excluded.
fn remove_outliers(values: &[f64]) -> Vec<f64> {
    if values.len() < 4 {
        return values.to_vec();
    }

    let mut sorted = values.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let q1 = percentile(&sorted, 25.0);
    let q3 = percentile(&sorted, 75.0);
    let iqr = q3 - q1;
    let lower = q1 - 1.5 * iqr;
    let upper = q3 + 1.5 * iqr;

    sorted
        .into_iter()
        .filter(|&x| x >= lower && x <= upper)
        .collect()
}

/// Linear interpolation percentile on a sorted slice.
fn percentile(sorted: &[f64], p: f64) -> f64 {
    let n = sorted.len();
    if n == 0 {
        return 0.0;
    }
    if n == 1 {
        return sorted[0];
    }
    let rank = p / 100.0 * (n - 1) as f64;
    let lo = rank.floor() as usize;
    let hi = rank.ceil() as usize;
    let frac = rank - lo as f64;
    sorted[lo] + frac * (sorted[hi] - sorted[lo])
}

// ── Statistics helpers ────────────────────────────────────────────────────────

fn median(sorted: &[f64]) -> Option<f64> {
    let n = sorted.len();
    if n == 0 {
        return None;
    }
    if n % 2 == 1 {
        Some(sorted[n / 2])
    } else {
        Some((sorted[n / 2 - 1] + sorted[n / 2]) / 2.0)
    }
}

fn mean(values: &[f64]) -> Option<f64> {
    if values.is_empty() {
        return None;
    }
    Some(values.iter().sum::<f64>() / values.len() as f64)
}

fn stddev(values: &[f64]) -> Option<f64> {
    let m = mean(values)?;
    if values.len() < 2 {
        return None;
    }
    let variance = values.iter().map(|x| (x - m).powi(2)).sum::<f64>() / (values.len() - 1) as f64;
    Some(variance.sqrt())
}

fn cv(values: &[f64]) -> Option<f64> {
    let m = mean(values)?;
    if m == 0.0 {
        return None;
    }
    Some(stddev(values)? / m * 100.0)
}

// ── Core processing ───────────────────────────────────────────────────────────

/// Groups rows by (browser, test, param) and runtime, applies IQR outlier
/// removal per group, computes per-param medians, then aggregates those medians
/// into a single ReportRow per (browser, test).
fn compute_report(rows: Vec<ResultRow>) -> Vec<ReportRow> {
    use std::collections::BTreeMap;

    // Group raw run times: key = (browser, test, param)
    // value = (native_runs, single_runs, multi_runs)
    let mut groups: BTreeMap<(String, String, i64), (Vec<f64>, Vec<f64>, Vec<f64>)> =
        BTreeMap::new();

    for row in rows {
        let entry = groups
            .entry((row.browser.clone(), row.test.clone(), row.param))
            .or_default();
        if let Some(v) = row.native {
            entry.0.push(v);
        }
        if let Some(v) = row.single {
            entry.1.push(v);
        }
        if let Some(v) = row.multi {
            entry.2.push(v);
        }
    }

    // For each (browser, test, param) compute per-runtime medians after IQR removal.
    // Then collect those param-level medians by (browser, test).
    let mut summary: BTreeMap<(String, String), (Vec<f64>, Vec<f64>, Vec<f64>, Vec<i64>)> =
        BTreeMap::new();

    for ((browser, test, param), (mut nat, mut sin, mut mul)) in groups {
        // Sort before outlier removal (remove_outliers re-sorts internally, but
        // we also need sorted slices for the median call afterwards).
        nat.sort_by(|a, b| a.partial_cmp(b).unwrap());
        sin.sort_by(|a, b| a.partial_cmp(b).unwrap());
        mul.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let nat_clean = remove_outliers(&nat);
        let sin_clean = remove_outliers(&sin);
        let mul_clean = remove_outliers(&mul);

        let entry = summary
            .entry((browser.clone(), test.clone()))
            .or_insert_with(|| (Vec::new(), Vec::new(), Vec::new(), Vec::new()));

        if let Some(m) = median(&nat_clean) {
            entry.0.push(m);
        }
        if let Some(m) = median(&sin_clean) {
            entry.1.push(m);
        }
        if let Some(m) = median(&mul_clean) {
            entry.2.push(m);
        }
        entry.3.push(param);
    }

    // Aggregate per-param medians → one ReportRow per (browser, test)
    let mut report = Vec::new();

    for ((browser, test), (nat_medians, sin_medians, mul_medians, params)) in summary {
        let mut nat_sorted = nat_medians.clone();
        let mut sin_sorted = sin_medians.clone();
        let mut mul_sorted = mul_medians.clone();
        nat_sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
        sin_sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
        mul_sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let native_median = median(&nat_sorted);
        let single_median = median(&sin_sorted);
        let multi_median = median(&mul_sorted);

        let native_cv = cv(&nat_medians);
        let single_cv = cv(&sin_medians);
        let multi_cv = cv(&mul_medians);

        let single_overhead = native_median.zip(single_median).map(|(n, s)| s / n);
        let multi_overhead = native_median.zip(multi_median).map(|(n, m)| m / n);
        let multi_vs_single_speedup = single_median.zip(multi_median).map(|(s, m)| s / m);

        let param_min = *params.iter().min().unwrap();
        let param_max = *params.iter().max().unwrap();

        report.push(ReportRow {
            browser,
            test,
            native_median,
            single_median,
            multi_median,
            native_cv,
            single_cv,
            multi_cv,
            single_overhead,
            multi_overhead,
            multi_vs_single_speedup,
            param_min,
            param_max,
        });
    }

    report
}

// ── DB helpers ────────────────────────────────────────────────────────────────

fn create_report_table(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS Report (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            browser               TEXT    NOT NULL,
            test                  TEXT    NOT NULL,
            native_median         REAL,
            single_median         REAL,
            multi_median          REAL,
            native_cv             REAL,
            single_cv             REAL,
            multi_cv              REAL,
            single_overhead       REAL,
            multi_overhead        REAL,
            multi_vs_single_speedup REAL,
            param_min             INTEGER NOT NULL,
            param_max             INTEGER NOT NULL,
            UNIQUE(browser, test)
        );",
    )
}

fn read_results(conn: &Connection) -> Result<Vec<ResultRow>> {
    let mut stmt =
        conn.prepare("SELECT browser, test, param, native, single, multi FROM Results")?;

    let rows = stmt.query_map([], |row| {
        Ok(ResultRow {
            browser: row.get(0)?,
            test: row.get(1)?,
            param: row.get(2)?,
            native: row.get(3)?,
            single: row.get(4)?,
            multi: row.get(5)?,
        })
    })?;

    rows.collect()
}

fn write_report(conn: &Connection, report: &[ReportRow]) -> Result<()> {
    // Clear stale data so re-runs are idempotent
    conn.execute_batch("DELETE FROM Report;")?;

    let mut stmt = conn.prepare(
        "INSERT INTO Report
            (browser, test,
             native_median, single_median, multi_median,
             native_cv, single_cv, multi_cv,
             single_overhead, multi_overhead, multi_vs_single_speedup,
             param_min, param_max)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)",
    )?;

    for r in report {
        stmt.execute(params![
            r.browser,
            r.test,
            r.native_median,
            r.single_median,
            r.multi_median,
            r.native_cv,
            r.single_cv,
            r.multi_cv,
            r.single_overhead,
            r.multi_overhead,
            r.multi_vs_single_speedup,
            r.param_min,
            r.param_max,
        ])?;
    }

    Ok(())
}

// ── Main ──────────────────────────────────────────────────────────────────────

fn main() -> Result<()> {
    let db_path = Path::new(MANIFEST_DIR)
        .join("../../results.db");
    
    let conn = Connection::open(&db_path)?;

    create_report_table(&conn)?;

    println!("Reading results from {:?}...", db_path.as_path());
    let results = read_results(&conn)?;
    println!("  {} rows loaded.", results.len());

    println!("Computing report...");
    let report = compute_report(results);
    println!("  {} report rows generated.", report.len());

    println!("Writing report to DB...");
    write_report(&conn, &report)?;
    println!("  Done. Report table updated.");

    Ok(())
}
