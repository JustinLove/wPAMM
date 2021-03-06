define([
  'pamm/download',
  'pamm/fix_paths',
  'pamm/download_scan',
  'pamm/promise',
], function(download, fix_paths, DownloadScan, Promise) {
  "use strict";

  var install = function(mod, extensions) {
    if (!mod.url) {
      console.error(mod.identifier, 'has no url to install')
      return
    }
    var cache = 'cache-'+mod.identifier + '_v' + mod.version + '.zip'
    var target = mod.identifier + '.zip'
    return Promise.wrap(api.download.list())
                  .then(function install_download_list(downloads) {
      if (downloads.indexOf(cache) == -1) {
        return download.save(mod.url, cache).then(function(status) {
          return fix_paths(status.file, target, mod.identifier)
        })
      } else {
        return fix_paths(cache, target, mod.identifier)
      }
    }).then(function install_touchup(statusAndZip) {
      var status = statusAndZip[0]
      var zip = statusAndZip[1]
      return new DownloadScan(extensions).examineZip(status.file, zip).then(function(scan) {
        if (scan.mods.length == 1) {
          _.assign(mod, scan.mods[0])
          mod.installed = true
        } else {
          console.warn(status.file, 'does not seem to contain one mod')
        }
        return status
      })
    }, function install_failed(err) {
      console.log('install failed', err)
      return err
    })
  }

  var uninstall = function(mod) {
    if (!mod.zipPath) {
      console.error(mod.identifier, 'has no zip to uninstall')
      return
    }
    var downloadItem = mod.zipPath.replace('/download/', '') 
    delete mod.zipPath
    mod.installed = false
    return Promise.wrap(api.download.delete(downloadItem))
  }

  return {
    install: install,
    uninstall: uninstall,
  }
})
