const API_URL = 'https://apimocker.com/users/search'

export async function searchUsers(query, signal) {
    const response = await fetch(
        `${API_URL}?q=${encodeURIComponent(query)}`,
        { signal }
    )

    if (!response.ok) {
        throw new Error('Ошибка запроса')
    }

    const data = await response.json()

    console.log(data)

    return data.results || []
}