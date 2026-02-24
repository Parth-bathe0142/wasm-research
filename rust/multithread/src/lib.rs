use rayon::prelude::*;
use wasm_bindgen::prelude::*;

pub use wasm_bindgen_rayon::init_thread_pool;

#[wasm_bindgen(start)]
fn init() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn sum_of_1_000_000_000() -> u64 {
    (0..1_000_000_000).into_par_iter().sum()
}

#[wasm_bindgen]
pub fn matrix_multiplication(a: &[f64], b: &[f64], n: usize) -> Vec<f64> {
    let mut result: Vec<f64> = vec![0.0; n * n];

    result.par_iter_mut().enumerate().for_each(|(ri, x)| {
        let i = ri / n;
        let j = ri % n;

        let mut sum = 0.0;
        for k in 0..n {
            sum += a[i * n + k] * b[k * n + j];
        }

        *x = sum;
    });

    result
}

#[wasm_bindgen]
pub fn image_blur(data: &[u8], size: usize) -> Vec<u8> {
    let kernel: [u8; 9] = [1, 2, 1, 2, 4, 2, 1, 2, 1];

    let mut result = vec![0u8; data.len()];

    result.par_iter_mut().enumerate().for_each(|(i, e)| {
        let x = i / size;
        let y = i % size;

        let mut acc = 0u8;
        let mut weight = 0u8;
        for j in 0..9 {
            let kx = (j / 3) - 1;
            let ky = (j % 3) - 1;

            let dx = kx + x as isize;
            let dy = ky + y as isize;

            if dx < 0 || dx >= size as isize || dy < 0 || dy >= size as isize {
                continue;
            };

            let dx = dx as usize;
            let dy = dy as usize;
            let j = j as usize;

            acc += data[dx * size + dy] * kernel[j];
            weight += kernel[j];
        }

        *e = acc / weight;
    });

    result
}

#[wasm_bindgen]
pub fn grep_search(query: &str, content: &str) -> Vec<String> {
    content
        .par_lines()
        .filter_map(|line| {
            if line.contains(query) {
                Some(line.to_string())
            } else {
                None
            }
        })
        .collect()
}

#[wasm_bindgen]
pub fn sort_array(mut array: Vec<f64>) -> Vec<f64> {
    array.par_sort_by(|a, b| a.partial_cmp(b).unwrap());
    array
}

#[wasm_bindgen]
pub fn correlation(xi: &[f32], yi: &[f32]) -> f32 {
    let (x_sum, y_sum) = xi
        .par_iter()
        .zip(yi.par_iter())
        .map(|(x, y)| (*x, *y))
        .reduce(|| (0., 0.), |acc, en| (acc.0 + en.0, acc.1 + en.1));

    let x_mean = x_sum / xi.len() as f32;
    let y_mean = y_sum / yi.len() as f32;

    let (xy, x_square_sum, y_square_sum) = xi
        .par_iter()
        .zip(yi.par_iter())
        .map(|(&x, &y)| {
            let x = x - x_mean;
            let y = y - y_mean;
            (x * y, x * x, y * y)
        })
        .reduce(
            || (0., 0., 0.),
            |acc, en| (acc.0 + en.0, acc.1 + en.1, acc.2 + en.2),
        );

    xy / (x_square_sum * y_square_sum).sqrt()
}
