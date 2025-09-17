#!/usr/bin/env Rscript

# Unified CLI entry for analyses
#   - Resolve project root (env-var first, then script-relative fallback)
#   - Source R/<analysis>.R defining analysis functions (e.g., Describe)
#   - Read JSON input, dispatch to analysis, write JSON to stdout
#
# Usage: cli.R <analysis> <input_json_path>
# - analysis: e.g., 'descriptive'
# - input_json_path: JSON file path (named list of numeric vectors; NA allowed)
#
## Note: jsonlite is required, but we attempt to activate renv first (below)

# Args parsing
args_trailing <- commandArgs(trailingOnly = TRUE)
if (length(args_trailing) < 2) {
  stop("Usage: cli.R <analysis> <input_json_path>")
}
analysis <- args_trailing[[1]]
input_path <- args_trailing[[2]]
if (!file.exists(input_path)) stop(paste0("Input file not found: ", input_path))

# Resolve project root: env-var first, then script-relative
resolve_script_path <- function() {
  args_full <- commandArgs(trailingOnly = FALSE)
  file_arg <- grep("^--file=", args_full, value = TRUE)
  if (length(file_arg) == 1) return(normalizePath(sub("^--file=", "", file_arg)))
  if (exists("ofile", where = sys.frames()[[1]])) return(normalizePath(sys.frames()[[1]]$ofile))
  stop("Failed to resolve CLI script path")
}

root <- Sys.getenv("R_PROJECT_ROOT", unset = NA_character_)
if (is.na(root) || !nzchar(root)) {
  script_path <- resolve_script_path()
  # script is expected at <repo>/src-r/cli.R
  cli_dir <- dirname(script_path)
  # src-r directory
  root <- cli_dir
}
root <- normalizePath(root)
r_dir <- file.path(root, "R")
if (!dir.exists(r_dir)) {
  # dev fallbacks relative to CWD
  alt1 <- file.path("src-r", "R")
  alt2 <- file.path("..", "src-r", "R")
  alt3 <- file.path("../..", "src-r", "R")
  for (alt in c(alt1, alt2, alt3)) {
    if (dir.exists(alt)) { r_dir <- alt; break }
  }
}
if (!dir.exists(r_dir)) stop("R directory not found (expected at src-r/R)")

# Activate renv if available under <root>/renv/activate.R
renv_activate <- file.path(root, "renv", "activate.R")
if (file.exists(renv_activate)) {
  # Activate project library paths
  source(renv_activate, local = FALSE)
}

# After activation, ensure jsonlite is available
suppressWarnings(suppressMessages({
  if (!requireNamespace("jsonlite", quietly = TRUE)) stop("Package 'jsonlite' is required.")
}))

# Dispatch: load required analysis function(s)
load_analysis <- function(name) {
  if (name == "descriptive") {
    src <- file.path(r_dir, "describe.R")
    if (!file.exists(src)) stop("describe.R not found under src-r/R")
    source(src, local = TRUE)
    fn_name <- "DescribeParsed"
    if (!exists(fn_name) || !is.function(get(fn_name))) stop("DescribeParsed() not defined after sourcing")
    return(get(fn_name))
  } else if (name == "correlation") {
    src <- file.path(r_dir, "correlation.R")
    if (!file.exists(src)) stop("correlation.R not found under src-r/R")
    source(src, local = TRUE)
    fn_name <- "CorrParsed"
    if (!exists(fn_name) || !is.function(get(fn_name))) stop("CorrParsed() not defined after sourcing")
    return(get(fn_name))
  }
  stop(paste0("Unknown analysis: ", name))
}

# Read input JSON and coerce to data.frame when needed
dat <- jsonlite::fromJSON(input_path)
if (is.list(dat) && !is.data.frame(dat)) dat <- as.data.frame(dat)

runner <- load_analysis(analysis)
out <- runner(dat)
cat(jsonlite::toJSON(out, auto_unbox = TRUE, na = "null"))
