import { readToothMeta } from './utils'

const args = process.argv.slice(2)
const pluginName = args[0]
if (!pluginName) throw new Error('Please provide a plugin name')

const toothMeta = readToothMeta(pluginName)
console.log(toothMeta.version)
