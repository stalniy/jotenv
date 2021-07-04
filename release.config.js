module.exports = {
  branches: [
    'main',
    '+([0-9])?(.{+([0-9]),x}).x'
  ],
  plugins: [
    ['@semantic-release/commit-analyzer', {
      releaseRules: [
        { type: 'chore', scope: 'deps', release: 'patch' },
        { type: 'docs', scope: 'README', release: 'patch' },
      ]
    }],
    '@semantic-release/release-notes-generator',
    ['@semantic-release/changelog', {
      changelogTitle: '# Change Log\n\nAll notable changes to this project will be documented in this file.'
    }],
    '@semantic-release/npm',
    '@semantic-release/git',
    "@semantic-release/github",
  ],
};
