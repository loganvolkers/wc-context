// @ts-check
import { ContextListener, ContextProvider } from "dom-context"

const orphanMap = {}

const resolved = Promise.resolve()

const orphanResolveQueue = {
  contexts: new Set(),
  running: false,
  add (context) {
    this.contexts.add(context)
    if (!this.running) {
      this.running = true
      resolved.then(() => {
        this.contexts.forEach(context => {
          const orphans = orphanMap[context]
          orphans.forEach(orphan => {
            const event = sendContextEvent(orphan, context)
            if (event.detail.handled) {
              orphans.delete(orphan)
            }
          })
        })
        this.contexts.clear()
        this.running = false
      })
    }
  }
}

function removeOrphan (el, name) {
  const orphans = orphanMap[name]
  if (orphans) {
    orphans.delete(el)
  }
}

/**
 * @param {HTMLElement} el
 * @param {string} name
 * @param {{ [x: string]: any; }} providedContexts
 */
function registerProvidedContext (el, name, providedContexts) {
  // const observerMap = el.__wcContextObserverMap || (el.__wcContextObserverMap = {})
  // const observers = observerMap[name] || (observerMap[name] = [])
  // const orphans = orphanMap[name]
  // el.addEventListener(`context-request-${name}`, (event) => {
  //   event.stopPropagation()
  //   const targetEl = event.target
  //   const value = providedContexts[name]
  //   const context = targetEl.context
  //   const oldValue = context[name]
  //   if (oldValue !== value) {
  //     context[name] = value
  //     if (targetEl.contextChangedCallback) {
  //       targetEl.contextChangedCallback(name, oldValue, value)
  //     }
  //   }
  //   observers.push(targetEl)
  //   event.detail.handled = true
  // })
  // if (orphans && orphans.size) {
  //   orphanResolveQueue.add(name)
  // }
  const provider = new ContextProvider({
    contextName: `context-request-${name}`,
    element: el,
    initialState: providedContexts[name]
  })
  provider.start();
  return provider;
}

/**
 * @param {HTMLElement} el - DOM element that will subscribe
 * @param {string} name - String context name
 */
function observeContext (el, name) {
  const listener = new ContextListener({
    element:el,
    contextName: `context-request-${name}`,
    onChange: (next)=>{

    },
    onStatus: (status)=>{
      console.log("New status", status);
    }
  })

  listener.start();

  return listener;
}

function notifyContextChange (el, name, value) {
  const observerMap = el.__wcContextObserverMap
  const observers = observerMap && observerMap[name]
  if (observers) {
    observers.forEach(observer => {
      const context = observer.context
      const oldValue = context[name]
      if (oldValue !== value) {
        context[name] = value
        if (observer.contextChangedCallback) {
          observer.contextChangedCallback(name, oldValue, value)
        }
      }
    })
  }
}

export {registerProvidedContext, observeContext, notifyContextChange}
