import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

function mount() {
  const root = document.getElementById('root')
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  }
}

// wujie 生命周期
if ((window as any).__POWERED_BY_WUJIE__) {
  let root: any = null
  ;(window as any).__WUJIE_MOUNT = () => {
    const el = document.getElementById('root')
    if (el) {
      root = ReactDOM.createRoot(el)
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      )
    }
  }
  ;(window as any).__WUJIE_UNMOUNT = () => {
    if (root) {
      root.unmount()
      root = null
    }
  }
} else {
  mount()
}
