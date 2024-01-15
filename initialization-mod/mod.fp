mod "local" {
  title       = "initialization-mod"
  description = "Run a pipelines to check if Flowpipe is running."
}

pipeline "initialization" {
  description = "Outputs the IP address for the server running flowpipe."
  step "http" "ip_address" {
    url = "https://api.ipify.org?format=json"
  }

  output "ip_address" {
    value = "Running flowpipe from IP: ${step.http.ip_address.response_body.ip}"
  }
}