# Cloudflare Workers

Workers we use for [nelson.social](https://nelson.social).

## About

Used to replace some HTML on the `/about` page.

## Signup

Sends a welcome email to new users and toots a `#introduction` welcome message about them. Triggered using Mastodon `account.created` webhook events.

## Digest (experiment)

An experiment to identify popular toots for the current day.
