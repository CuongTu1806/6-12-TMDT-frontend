const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

async function parseJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function getAllCategories() {
  const response = await fetch(`${API_BASE_URL}/api/categories`)
  const json = await parseJson(response)

  if (!response.ok || !Array.isArray(json)) {
    throw new Error('Khong tai duoc danh muc')
  }

  return json
}

export async function getVisibleProducts(page = 0, pageSize = 12) {
  const response = await fetch(
    `${API_BASE_URL}/api/products?page=${page}&pageSize=${pageSize}`,
  )
  const json = await parseJson(response)

  if (!response.ok || !json?.content) {
    throw new Error('Khong tai duoc danh sach san pham')
  }

  return json
}

export async function getProductsByCategory(categoryId, page = 0, pageSize = 12) {
  const url = `${API_BASE_URL}/api/products/category/${categoryId}?page=${page}&pageSize=${pageSize}`
  console.log('Fetching products:', url)
  
  try {
    const response = await fetch(url)
    console.log('Response status:', response.status)
    
    const json = await parseJson(response)
    console.log('Response data:', json)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    if (!json?.content) {
      console.warn('Missing content field in response:', json)
      throw new Error('Khong tai duoc san pham theo danh muc')
    }

    console.log('Successfully fetched', json.content.length, 'products')
    return json
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

export async function searchProducts(searchRequest) {
  const url = `${API_BASE_URL}/api/products/search`
  console.log('Search request:', searchRequest)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchRequest),
    })

    console.log('Search response status:', response.status)
    const json = await parseJson(response)
    console.log('Search response data:', json)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    if (!json?.content) {
      console.warn('Missing content field in search response:', json)
      throw new Error('Khong tai duoc ket qua tim kiem')
    }

    return json
  } catch (error) {
    console.error('Error searching products:', error)
    throw error
  }
}
