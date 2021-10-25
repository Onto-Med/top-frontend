import { describe, expect, it } from '@jest/globals';
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-jest';
import { mount } from '@vue/test-utils';
import LocalizedTextInput from '@/components/LocalizedTextInput.vue'

// Specify here Quasar config you'll need to test your component
installQuasarPlugin();

describe('LocalizedTextInput.vue', () => {
  it('adds empty localized string', async () => {
    const titles: Record<string, unknown>[] = []
    const wrapper = mount(LocalizedTextInput, {
      props: { modelValue: titles }
    })
    expect(wrapper.find('button.remove-localized-text-btn').exists()).toBeFalsy()
    const btn = wrapper.find('button.add-localized-text-btn')
    expect(btn.exists()).toBeTruthy()
    await btn.trigger('click')
    expect(titles.length).toBe(1)
  })

  it('removes localized string', async () => {
    const titles = [
      { lang: 'de', text: 'Beispiel' },
      { lang: 'en', text: 'Example' }
    ]
    const wrapper = mount(LocalizedTextInput, {
      props: { modelValue: titles }
    })
    const btns = wrapper.findAll('button.remove-localized-text-btn')
    expect(btns.length).toBe(2)
    expect(btns[1].exists()).toBeTruthy()
    await btns[1].trigger('click')
    expect(titles.length).toBe(1)
  })
})
