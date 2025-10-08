export function onBeforeLeave(el: Element) {
    const node = el as HTMLElement
    const { width, height } = node.getBoundingClientRect()
    node.style.width = `${width}px`
    node.style.height = `${height}px`
    node.style.position = 'absolute'   // вынимаем из потока, но уже с фикс. размерами
}