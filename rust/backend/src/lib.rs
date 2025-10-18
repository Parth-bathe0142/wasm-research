use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use serde_wasm_bindgen::{from_value, to_value};

#[wasm_bindgen(start)]
fn init() {
    console_error_panic_hook::set_once();
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Point {
    x: i32,
    y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TestData {
    native: Vec<Point>,
    single: Vec<Point>,
    multi: Vec<Point>,
}

type TestResult = HashMap<String, TestData>;

#[wasm_bindgen]
pub fn average_results(results: JsValue) -> Result<JsValue, serde_wasm_bindgen::Error> {
    let results: TestResult = from_value(results).unwrap();
    
    let averages: TestResult = results
        .into_iter()
        .map(|(k, data)| {
            let td = TestData {
                native: process_results(&data.native),
                single: process_results(&data.single),
                multi: process_results(&data.multi)
            };
            
            (k, td)
        })
        .collect();
    
    Ok(to_value(&averages).unwrap())
}

fn process_results(res: &[Point]) -> Vec<Point> {
    let mut map = HashMap::new();
    for p in res {
        let entry = map
            .entry(p.x)
            .or_insert((0.0, 0));
        
        entry.0 += p.y;
        entry.1 += 1;
    }
    
    let mut averages: Vec<Point> = map
        .iter()
        .map(|(&x, &(sum, count))| {
            Point { x, y: sum / count as f64 }
        })
        .collect();
    
    averages.sort_by(|a, b| a.x.cmp(&b.x));
    averages
}
