use serde::{
    Deserialize,
    Serialize,
};

/// UIへ返す表データの共通DTO
/// `headers`は列名、`rows`は行×列の2次元配列（不足セルは`null`になる場合あり）
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ParsedTable {
    pub headers: Vec<String>,
    pub rows: Vec<Vec<serde_json::Value>>,
}
