import { shallowMount } from '@vue/test-utils'
import LocalizedTextInput from '@/components/LocalizedTextInput.vue'

describe('LocalizedTextInput.vue', () => {
  it('adds empty localized string', () => {
    const titles: Record<string, unknown>[] = []
    const wrapper = shallowMount(LocalizedTextInput, {
      props: { modelValue: titles }
    })
    expect(wrapper.find('button.remove-localized-text-btn').exists()).toBeFalsy()
    const btn = wrapper.find('button.add-localized-text-btn')
    expect(btn.exists()).toBeTruthy()
    btn.trigger('click')
    expect(titles.length).toBe(1)
  })

  it('removes localized string', () => {
    const titles = [
      { lang: 'de', text: 'Beispiel' },
      { lang: 'en', text: 'Example' }
    ]
    const wrapper = shallowMount(LocalizedTextInput, {
      props: { modelValue: titles }
    })
    const btns = wrapper.findAll('button.remove-localized-text-btn')
    expect(btns.length).toBe(2)
    expect(btns[1].exists()).toBeTruthy()
    btns[1].trigger('click')
    expect(titles.length).toBe(1)
  })
})
