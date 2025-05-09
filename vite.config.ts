import * as fsPromises from 'fs/promises'
import copy from 'rollup-plugin-copy'
import scss from 'rollup-plugin-scss'
import { defineConfig, loadEnv, Plugin } from 'vite'

const moduleVersion = process.env.MODULE_VERSION
const githubProject = process.env.GH_PROJECT
const githubTag = process.env.GH_TAG

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const distPath =
    env.MODE === 'development' ? '../vampire-20-exp-counter' : 'dist'
  return {
    build: {
      sourcemap: true,
      rollupOptions: {
        input: 'src/ts/module.ts',
        output: {
          dir: `${distPath}/scripts`,
          entryFileNames: 'module.js',
          format: 'es',
        },
      },
    },
    plugins: [
      updateModuleManifestPlugin(distPath),
      scss({
        output: `${distPath}/style.css`,
        sourceMap: true,
        watch: ['src/styles/*.scss'],
      }),
      copy({
        targets: [
          { src: 'src/languages', dest: `${distPath}` },
          { src: 'src/templates', dest: `${distPath}` },
        ],
        hook: 'writeBundle',
      }),
    ],
  }
})

function updateModuleManifestPlugin(distPath: string): Plugin {
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
        `${distPath}/module.json`,
        JSON.stringify(manifestJson, null, 4)
      )
    },
  }
}
