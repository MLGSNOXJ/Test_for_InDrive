const API_URL = import.meta.env.VITE_API_URL || 'https://api.apimocker.com/users/search'

export async function searchUsers(query, signal) {
    const response = await fetch(
        `${API_URL}?q=${encodeURIComponent(query)}`,
        { signal }
    )

    if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`)
    }

    const data = await response.json()

    // Защита: если API вернет массив напрямую, используем его. 
    // Иначе ищем поле results, как было изначально.
    if (Array.isArray(data)) {
        return data
    }
    
    return data.results || []
}