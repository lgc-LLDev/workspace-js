import fs from 'node:fs'
import path from 'node:path'

import { readToothMeta } from './utils'

const args = process.argv.slice(2)
const pluginName = args[0]
if (!pluginName) throw new Error('Please provide a plugin name')

const toothMeta = readToothMeta(pluginName)

const tmpFolderPath = 'github-release-tmp'
fs.mkdirSync(tmpFolderPath)

toothMeta.files.place.forEach(({ src }) => {
  const folder = path.dirname(src)
  fs.mkdirSync(path.join(tmpFolderPath, folder), { recursive: true })
  fs.copyFileSync(src, path.join(tmpFolderPath, src))
})

fs.copyFileSync('tooth.json', path.join(tmpFolderPath, 'tooth.json'))
