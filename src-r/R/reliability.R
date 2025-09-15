# Reliability analysis

# Calculate cronbach's alpha
#
# Args:
# - x (data.frame or matrix): The Dataset where rows are subject and colmns are items.
#
# Returns:
# - alpha (numeric): The Cronbach's alpha coefficient of the input dataset.
#
CronbachAlpha <- function(x) {
  # Get the number of items
  n_cols <- ncol(x)
  if (n_cols < 2) {
    stop("The input dataset must have at least two items.")
  }

  # Calculate the variance of each item
  item_var <- apply(x, 2, var)

  # Calculate the variance of the total score of all items
  total_var <- var(rowSums(x))

  # Calculate the Cronbach's alpha coefficient
  alpha <- (n_cols / (n_cols - 1)) * (1 - (sum(item_var) / total_var))

  return(alpha)
}
