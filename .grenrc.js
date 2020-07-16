module.exports = {
  template: {
      release: function (placeholders) {
        return `## ${placeholders.release}}\n{{body}}`
      }
  }
}
