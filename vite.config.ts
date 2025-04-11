import * as fsPromises from 'fs/promises'
import copy from 'rollup-plugin-copy'
import scss from 'rollup-plugin-scss'
import { defineConfig, Plugin } from 'vite'

const moduleVersion = process.env.MODULE_VERSION
const githubProject = process.env.GH_PROJECT
const githubTag = process.env.GH_TAG

console.log(process.env.VSCODE_INJECTION)
const DIST_PATH_DEV = '../vampire-20-exp-counter'
const DIST_PATH_PROD = 'dist'
export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      input: 'src/ts/module.ts',
      output: {
        dir: `${DIST_PATH_PROD}/scripts`,
        entryFileNames: 'module.js',
        format: 'es',
      },
    },
  },
  plugins: [
    updateModuleManifestPlugin(),
    scss({
      output: `${DIST_PATH_PROD}/style.css`,
      sourceMap: true,
      watch: ['src/styles/*.scss'],
    }),
    copy({
      targets: [
        { src: 'src/languages', dest: `${DIST_PATH_PROD}` },
        { src: 'src/templates', dest: `${DIST_PATH_PROD}` },
      ],
      hook: 'writeBundle',
    }),
  ],
})

function updateModuleManifestPlugin(): Plugin {
  return {
    name: 'update-module-manifest',
    async writeBundle(): Promise<void> {
      const packageContents = JSON.parse(
        await fsPromises.readFile('./package.json', 'utf-8')
      ) as Record<string, unknown>
      const version = moduleVersion || (packageContents.version as string)
      const manifestContents: string = await fsPromises.readFile(
        'src/module.json',
        'utf-8'
      )
      const manifestJson = JSON.parse(manifestContents) as Record<
        string,
        unknown
      >
      manifestJson['version'] = version
      if (githubProject) {
        const baseUrl = `https://github.com/${githubProject}/releases`
        manifestJson['manifest'] = `${baseUrl}/latest/download/module.json`
        if (githubTag) {
          manifestJson[
            'download'
          ] = `${baseUrl}/download/${githubTag}/module.zip`
        }
      }
      await fsPromises.writeFile(
        `${DIST_PATH_PROD}/module.json`,
        JSON.stringify(manifestJson, null, 4)
      )
    },
  }
}
