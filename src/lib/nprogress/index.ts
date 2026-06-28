import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// 打开进度条
const start = () => {
  NProgress.start()
}

// 结束进度条
const done = () => {
  NProgress.done()
}

export default { start, done }
