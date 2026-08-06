# Local preview image: the same Jekyll + plugins GitHub Pages uses (github-pages gem).
# Built automatically by preview.ps1 — you don't need to run this yourself.
FROM ruby:3.3
RUN gem install github-pages webrick --no-document
WORKDIR /site
EXPOSE 4000 35729
CMD ["jekyll", "serve", "--host", "0.0.0.0", "--livereload", "--force_polling"]
