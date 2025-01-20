import fs from 'node:fs'
import path from 'node:path'

export interface ToothMetaFilesPlace {
  src: string
  dest: string
}

export interface ToothMetaFiles {
  place: ToothMetaFilesPlace[]
}

export interface ToothMeta {
  version: string
  files: ToothMetaFiles
}

export function joinPluginPath(pluginName: string, ...paths: string[]): string {
  return path.join('plugins', pluginName, ...paths)
}

export function readToothMeta(pluginName: string): ToothMeta {
  const toothMetaJson = fs.readFileSync(
    joinPluginPath(pluginName, 'tooth.json'),
    'utf8',
  )
  return JSON.parse(toothMetaJson)
}
