import { describe, expect, it } from '@jest/globals';
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-jest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n';
import UcumCard from 'src/components/UcumCard.vue'

// Specify here Quasar config you'll need to test your component
installQuasarPlugin();

const i18n = createI18n({
  legacy: false,
  messages
})

describe('UcumCard.vue', () => {
  it('adds empty ucum string', async () => {
    const wrapper = mount(UcumCard, {
      props: { modelValue: [] },
      global: { plugins: [i18n] }
    })
    expect(wrapper).toBeTruthy()
    expect(wrapper.find('button.remove-ucum-btn').exists()).toBeFalsy()
    const btn = wrapper.find('button.add-ucum-btn')
    expect(btn.exists()).toBeTruthy()
    await btn.trigger('click')
    let emitted = wrapper.emitted('update:modelValue')[0][0]
    expect(emitted.length).toBe(1)
  })

  it('removes localized string', async () => {
    const wrapper = mount(UcumCard, {
      props: {
        modelValue: [ 'm', 'kg' ]
      },
      global: { plugins: [i18n] }
    })
    expect(wrapper).toBeTruthy()
    const btns = wrapper.findAll('button.remove-ucum-btn')
    expect(btns.length).toBe(2)
    expect(btns[1].exists()).toBeTruthy()
    await btns[1].trigger('click')
    let emitted = wrapper.emitted('update:modelValue')[0][0]
    expect(emitted.length).toBe(1)
  })
})
