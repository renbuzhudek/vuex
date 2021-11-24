import { forEachValue } from '../util'
// 存储模块的基本数据结构，包含一些属性和方法
// Base data struct for store's module, package with some attribute and method
export default class Module {
  constructor (rawModule, runtime) {
    this.runtime = runtime
    // Store some children item  子模块项
    this._children = Object.create(null)
    // Store the origin module object which passed by programmer 存储程序传递的原始模块对象
    this._rawModule = rawModule
    const rawState = rawModule.state

    // Store the origin module's state 仓库的原始模块的状态对象
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {}
  }
  // 是否命名空间
  get namespaced () {
    return !!this._rawModule.namespaced
  }
  // 添加子模块
  addChild (key, module) {
    this._children[key] = module
  }
  // 删除子模块
  removeChild (key) {
    delete this._children[key]
  }
  // 获取子模块
  getChild (key) {
    return this._children[key]
  }
  // 是否包含子模块
  hasChild (key) {
    return key in this._children
  }
  // 更新模块
  update (rawModule) {
    this._rawModule.namespaced = rawModule.namespaced
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters
    }
  }
  // 遍历子模块
  forEachChild (fn) {
    forEachValue(this._children, fn)
  }
  // 遍历模块的 getters 对象
  forEachGetter (fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn)
    }
  }
  // 遍历模块的 actions
  forEachAction (fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn)
    }
  }
  // 遍历模块的 mutations
  forEachMutation (fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn)
    }
  }
}
