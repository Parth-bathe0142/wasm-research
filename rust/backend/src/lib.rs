use serde::{Deserialize, Serialize};
use serde_wasm_bindgen::{from_value, to_value};
use std::collections::BTreeMap;
use wasm_bindgen::prelude::*;
use js_sys::{Object, Reflect};

#[wasm_bindgen(start)]
fn init() {
    console_error_panic_hook::set_once();
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
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

type TestResult = BTreeMap<String, TestData>;

#[wasm_bindgen]
pub fn average_results(results: JsValue) -> Result<JsValue, serde_wasm_bindgen::Error> {
    let results: TestResult = from_value(results).unwrap();

    let averages: TestResult = results
        .into_iter()
        .map(|(k, data)| {
            let td = TestData {
                native: process_results(&data.native),
                single: process_results(&data.single),
                multi: process_results(&data.multi),
            };

            (k, td)
        })
        .collect();
    
    let js_obj = Object::new();
    for (k, v) in averages.iter() {
        let v = to_value(v).unwrap();
        Reflect::set(&js_obj, &JsValue::from_str(&k), &v).unwrap();
    }
    
    Ok(js_obj.into())
}

fn process_results(res: &[Point]) -> Vec<Point> {
    let mut map = BTreeMap::new();
    for p in res {
        let entry = map.entry(p.x).or_insert((0.0, 0));

        entry.0 += p.y;
        entry.1 += 1;
    }

    let mut averages: Vec<Point> = map
        .iter()
        .map(|(&x, &(sum, count))| Point {
            x,
            y: sum / count as f64,
        })
        .collect();

    averages.sort_by(|a, b| a.x.cmp(&b.x));
    averages
}

#[cfg(test)]
mod test {
    use super::*;
    use wasm_bindgen_test::*;
    
    #[wasm_bindgen_test]
    fn test_process_results() {
        let points = [
            Point { x: 1, y: 1. },
            Point { x: 1, y: 2. },
            Point { x: 2, y: 3. },
            Point { x: 2, y: 4. },
        ];
        
        let processed = process_results(&points);
        
        assert!(
            vec![
                Point { x: 1, y: 1.5 },
                Point { x: 2, y: 3.5 },
            ].iter()
            .enumerate()
            .all(|(i, e)| *e == processed[i])
        );
    }
}
