module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: [
      'backend-bin/finite_pop_backend'
    ]
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    }
  ]
};