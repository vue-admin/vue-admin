<template>
  <div id="terminal"
      v-loading="loading"
      ref="terminal"
      element-loading-text="拼命连接中"
  ></div>
</template>
<script lang="ts" setup>
import { Ref,ref, onMounted, onBeforeUnmount, watch } from "vue";
import { debounce } from 'lodash'
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const terminal = ref(null);
const props = defineProps({
  terminalDetail: Object,
  type: String
});
const fitAddon = new FitAddon();

let first = ref(true);
let loading = ref(true);
let terminalSocket: Ref<WebSocket|null> = ref(null);
let term: Ref<Terminal|null> = ref(null);


const runRealTerminal = () => {
  loading.value = false;
}

const onWSReceive = (message: { data: any; }) => {
  // 首次接收消息,发送给后端，进行同步适配
  if (first.value === true) {
      first.value = false;
      resizeRemoteTerminal();
  }
  term.value?.element && term.value?.focus()
  term.value?.write(message.data)
}

const errorRealTerminal = () => {
  let message = '';
  if (!message) message = 'disconnected'
  term.value?.write(`\x1b[31m${message}\x1b[m\r\n`)
  console.log("err");
}
const closeRealTerminal = () => {
  console.log("close");
  
}

const createWS = () => {
  const url = 'ws://localhost:8080/ws'
  terminalSocket.value = new WebSocket(url);
  terminalSocket.value.onopen = runRealTerminal;
  terminalSocket.value.onmessage = onWSReceive;
  terminalSocket.value.onclose = closeRealTerminal;
  terminalSocket.value.onerror = errorRealTerminal;
}
const initWS = () => {
  if (!terminalSocket.value) {
      createWS();
  }
  if (terminalSocket.value && terminalSocket.value.readyState > 1) {
      terminalSocket.value.close();
      createWS();
  }
}
// 发送给后端,调整后端终端大小,和前端保持一致,不然前端只是范围变大了,命令还是会换行
const resizeRemoteTerminal = () => {
  //const { cols, rows } = term.value
  if (isWsOpen()) {
      terminalSocket.value?.send(JSON.stringify({ type: "cmd",cmd:"",cols:term.value?.cols,rows:term.value?.rows}))
  }
}
const initTerm = () => {
  term.value = new Terminal({
      lineHeight: 1.2,
      fontSize: 12,
      fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
      theme: {
          background: '#181d28',
      },
      // 光标闪烁
      cursorBlink: true,
      cursorStyle: 'underline',
      scrollback: 100,
      tabStopWidth: 4,
  });
  terminal.value ? term.value.open(terminal.value):null;
  term.value.loadAddon(fitAddon);
 // 不能初始化的时候fit,需要等terminal准备就绪,可以设置延时操作
  setTimeout(() => {
      fitAddon.fit();
  }, 5)
}
// 是否连接中0 1 2 3 
const isWsOpen = () => {
  const readyState = terminalSocket.value && terminalSocket.value.readyState;
  return readyState === 1
}
const fitTerm = () => {
  fitAddon.fit();
}
const onResize = debounce((e) => {
  fitTerm();
  console.log(term.value?.cols + "---" + term.value?.rows)
  terminalSocket.value?.send(JSON.stringify({ type: "resize",cols:term.value?.cols,rows:term.value?.rows}));
});

const termData = () => {
  // 输入与粘贴的情况,onData不能重复绑定,不然会发送多次
  term.value?.onData((data: any) => {
      if (isWsOpen()) {
        console.log(term.value?.cols + "---" + term.value?.rows)
          terminalSocket.value?.send(JSON.stringify({ type: "cmd",cmd:data,cols:term.value?.cols, rows:term.value?.rows}));
      }
  });
}
const onTerminalResize = () => {
  window.addEventListener("resize", onResize);
}
const removeResizeListener = () => {
  window.removeEventListener("resize", onResize);
}
// 监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
window.onbeforeunload = function() {
  terminalSocket.value?.close(1000,"refresh");
}
//监听类型变化，重置term
watch(() => props.type, () => {
  first.value = true;
  loading.value = true;
  terminalSocket.value = null;
  initWS();
  // 重置
  term.value?.reset();
})

onMounted(() => {
  initWS();
  initTerm();
  termData();
  onTerminalResize();
})
onBeforeUnmount(() => {
  removeResizeListener();
  terminalSocket.value && terminalSocket.value.close();
})
</script>
<style scoped>
#terminal {
  width: 100%;
  height: 100%;
}
</style>