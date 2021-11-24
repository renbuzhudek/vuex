import Module from './module'
import { assert, forEachValue } from '../util'

export default class ModuleCollection {
  constructor (rawRootModule) {
    // register root module (Vuex.Store options)  注册根模块 runtime=false
    this.register([], rawRootModule, false)
  }
  // 通过数组path，形如['moduleA','moduleB','moduleC'] 获取根模块root的嵌套子模块实例 moduleC ，依赖路径: root -> moduleA -> moduleB -> moduleC
  get (path) {
    return path.reduce((module, key) => {
      return module.getChild(key)
    }, this.root)
  }
  // 通过path数组获取命名空间模块的命名空间名称 形如：[a,b,c] -> a/b/c , 假设a,c启用命名空间，b没有， 得到 a/c
  getNamespace (path) {
    let module = this.root
    return path.reduce((namespace, key) => {
      module = module.getChild(key)
      return namespace + (module.namespaced ? key + '/' : '')
    }, '')
  }
  // 更新根模块
  update (rawRootModule) {
    update([], this.root, rawRootModule)
  }
  // 注册模块
  register (path, rawModule, runtime = true) {
    if (__DEV__) {
      assertRawModule(path, rawModule)
    }

    const newModule = new Module(rawModule, runtime)
    if (path.length === 0) {// 根模块赋值 root
      this.root = newModule
    } else { //否则不是根目录，获取当前模块的父模块实例，为父模块添加该子模块; .slice(0, -1) 相当于数组去掉最后一项，最后一项是当前子模块名称
      const parent = this.get(path.slice(0, -1))
      parent.addChild(path[path.length - 1], newModule)
    }
    // 注册嵌套模块, 如果有modules，递归注册子模块, path 是模块名称数组，每嵌套一层添加一个名称
    // register nested modules
    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(path.concat(key), rawChildModule, runtime)
      })
    }
  }
  // 卸载模块
  unregister (path) {
    const parent = this.get(path.slice(0, -1))
    const key = path[path.length - 1]
    const child = parent.getChild(key)
  // 如果不存在该子模块，报错提示 没有注册
    if (!child) {
      if (__DEV__) {
        console.warn(
          `[vuex] trying to unregister module '${key}', which is ` +
          `not registered`
        )
      }
      return
    }

    if (!child.runtime) {
      return
    }
// 移除子模块
    parent.removeChild(key)
  }
  // 判断模块是否已注册
  isRegistered (path) {
    const parent = this.get(path.slice(0, -1))// 获取父模块实例
    const key = path[path.length - 1]// 获取当前模块名称
    // 判断父模块是否已经注册该子模块
    return parent.hasChild(key)
  }
}

function update (path, targetModule, newModule) {
  if (__DEV__) {
    assertRawModule(path, newModule)
  }

  // update target module
  targetModule.update(newModule)

  // update nested modules
  if (newModule.modules) {
    for (const key in newModule.modules) {
      if (!targetModule.getChild(key)) {
        if (__DEV__) {
          console.warn(
            `[vuex] trying to add a new module '${key}' on hot reloading, ` +
            'manual reload is needed'
          )
        }
        return
      }
      update(
        path.concat(key),
        targetModule.getChild(key),
        newModule.modules[key]
      )
    }
  }
}
// 函数资源
const functionAssert = {
  assert: value => typeof value === 'function',
  expected: 'function'
}
// 对象资源 函数或者包含 handler 属性的对象
const objectAssert = {
  assert: value => typeof value === 'function' ||
    (typeof value === 'object' && typeof value.handler === 'function'),
  expected: 'function or object with "handler" function'
}
// 定义 getters mutations actions 的资源类型
const assertTypes = {
  getters: functionAssert,
  mutations: functionAssert,
  actions: objectAssert
}
// 遍历模块的 getters mutations actions 对象，验证属性值是否是符合预期的类型
function assertRawModule (path, rawModule) {
  Object.keys(assertTypes).forEach(key => {
    if (!rawModule[key]) return

    const assertOptions = assertTypes[key]

    forEachValue(rawModule[key], (value, type) => {
      assert(
        assertOptions.assert(value),
        makeAssertionMessage(path, key, type, value, assertOptions.expected)
      )
    })
  })
}
// 构造资源报错消息
function makeAssertionMessage (path, key, type, value, expected) {
  let buf = `${key} should be ${expected} but "${key}.${type}"`
  if (path.length > 0) {
    buf += ` in module "${path.join('.')}"`
  }
  buf += ` is ${JSON.stringify(value)}.`
  return buf
}
