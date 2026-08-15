<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  messages: Array<{from: string; content: string; time: string}>
}>()

// 判断消息来源类型
function isSubApp(from: string): boolean {
  return from !== '系统' && from !== '主应用'
}

const groupedMessages = computed(() => {
  const result: Array<{type: 'system' | 'parent' | 'child'; msgs: typeof props.messages}> = []
  const systemMsgs: typeof props.messages = []
  const parentMsgs: typeof props.messages = []
  const childMsgs: typeof props.messages = []

  for (const msg of props.messages) {
    if (msg.from === '系统') {
      systemMsgs.push(msg)
    } else if (isSubApp(msg.from)) {
      childMsgs.push(msg)
    } else {
      parentMsgs.push(msg)
    }
  }

  if (systemMsgs.length > 0) result.push({ type: 'system', msgs: systemMsgs })
  if (parentMsgs.length > 0) result.push({ type: 'parent', msgs: parentMsgs })
  if (childMsgs.length > 0) result.push({ type: 'child', msgs: childMsgs })

  return result
})
</script>

<template>
  <div class="h-52 border-t bg-card overflow-auto p-4">
    <h3 class="text-sm font-semibold text-muted-foreground mb-2">通信消息面板（主应用视角）</h3>
    <template v-for="(group, gi) in groupedMessages" :key="gi">
      <!-- 分组间虚线分隔 -->
      <div v-if="gi > 0" class="border-t-2 border-dashed border-gray-300 my-2"></div>
      <!-- 分组标签 -->
      <div v-if="group.type === 'parent'" class="text-[10px] text-blue-500 font-medium mb-1">&#8212;&#8212;&#8212; 父应用消息 &#8212;&#8212;&#8212;</div>
      <div v-else-if="group.type === 'child'" class="text-[10px] text-green-500 font-medium mb-1">&#8212;&#8212;&#8212; 子应用消息 &#8212;&#8212;&#8212;</div>
      <!-- 消息列表 -->
      <div
        v-for="(msg, i) in group.msgs"
        :key="gi + '-' + i"
        class="text-xs py-1 flex gap-2"
      >
        <span class="text-primary font-medium whitespace-nowrap">[{{ msg.time }}]</span>
        <span class="text-muted-foreground font-medium">{{ msg.from }}:</span>
        <span>{{ msg.content }}</span>
      </div>
    </template>
    <p v-if="messages.length === 0" class="text-xs text-muted-foreground">暂无消息</p>
  </div>
</template>
