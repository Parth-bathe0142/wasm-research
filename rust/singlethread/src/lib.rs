use rand::{rngs::SmallRng, Rng, RngCore, SeedableRng};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn random_grep_data(lines: i32, length: i32, query: String) -> String {
    let mut content = "".to_string();
    let mut srng = SmallRng::seed_from_u64(getrandom::u64().unwrap());

    for _ in 0..lines {
        let mut bytes = vec![0u8; length as usize];
        srng.fill_bytes(bytes.as_mut_slice());

        let mut str = bytes
            .iter_mut()
            .map(|x| char::from(b'a' + *x % 26u8))
            .collect::<String>();

        str.push_str("\n");

        let chance = srng.random::<f32>();
        if chance < 0.3 {
            let pos = srng.random::<u8>() as usize % length as usize;
            str.insert_str(pos, query.as_str());
        }

        content.push_str(&str);
    }

    content
}

#[wasm_bindgen]
pub fn sum_of_1_000_000_000() -> u64 {
    (0..1_000_000_000).into_iter().sum()
}

#[wasm_bindgen]
pub fn matrix_multiplication(a: &[f64], b: &[f64], n: usize) -> Vec<f64> {
    let mut result = vec![0.0; n * n];

    for i in 0..n {
        for j in 0..n {
            for k in 0..n {
                result[i * n + j] += a[i * n + k] * b[k * n + j];
            }
        }
    }

    result
}

#[wasm_bindgen]
pub fn image_blur(data: &[u8], width: usize, height: usize) -> Vec<u8> {
    let kernel: [u8; 9] = [1, 2, 1, 2, 4, 2, 1, 2, 1];

    let mut result = vec![0u8; data.len()];

    result.iter_mut().enumerate().for_each(|(i, e)| {
        let x = i / width;
        let y = i % width;

        let mut acc = 0u8;
        let mut weight = 0u8;
        for j in 0..9 {
            let kx = (j / 3) - 1;
            let ky = (j % 3) - 1;

            let dx = kx + x as isize;
            let dy = ky + y as isize;

            if dx < 0 || dx >= height as isize || dy < 0 || dy >= width as isize {
                continue;
            };

            let dx = dx as usize;
            let dy = dy as usize;
            let j = j as usize;

            acc += data[dx * width + dy] * kernel[j];
            weight += kernel[j];
        }

        *e = acc / weight;
    });

    result
}

#[wasm_bindgen]
pub fn grep_search(query: String, content: String) -> Vec<String> {
    let mut result = vec![];

    for line in content.lines() {
        if line.contains(query.as_str()) {
            result.push(line.into());
        }
    }

    result
}

#[wasm_bindgen]
pub fn sort_array(mut array: Vec<f64>) -> Vec<f64> {
    array.sort_by(|a, b| a.partial_cmp(b).unwrap());
    array
}