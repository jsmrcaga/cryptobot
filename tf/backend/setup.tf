terraform {
  backend "remote" {
    organization = "jsmrcaga"

    workspaces {
      name = "CryptoBot"
    }
  }
}
