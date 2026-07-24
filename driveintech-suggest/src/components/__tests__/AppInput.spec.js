import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '../AppInput.vue'

describe('AppInput.vue', () => {
  it('корректно отображает placeholder', () => {
    const wrapper = mount(AppInput, {
      props: { placeholder: 'Тестовый запрос' }
    })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Тестовый запрос')
  })

  it('корректно эмитит событие select при выборе пользователя', async () => {
    const wrapper = mount(AppInput)
    const mockUser = { id: 1, name: 'Иван Иванов' }
    
    // Вызываем метод напрямую для проверки эмита
    await wrapper.vm.selectUser(mockUser)
    
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual([mockUser])
  })
})