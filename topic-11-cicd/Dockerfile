# ============================================================
# Dockerfile — run Playwright tests in a container
# ============================================================
#
# Build:  docker build -t playwright-cicd .
# Run:    docker run --rm playwright-cicd
# Shell:  docker run --rm -it playwright-cicd bash
#
# Official Playwright image already includes browsers + OS deps.

FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app

# Copy manifests first → better Docker layer cache
COPY package.json package-lock.json* ./

# Install node modules (browsers already in base image)
RUN npm ci

# Copy project source (tests + site + config)
COPY playwright.config.js ./
COPY site ./site
COPY tests ./tests

# Default: run the full suite
# CI=true enables retries + forbidOnly inside playwright.config.js
ENV CI=true

CMD ["npx", "playwright", "test", "--reporter=list,html,junit"]
