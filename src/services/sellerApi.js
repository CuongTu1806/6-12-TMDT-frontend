const API_BASE_URL = 'http://localhost:8080/api/seller'
const SESSION_KEY = 'tmdt-auth-session'

const getToken = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    return session?.token || null
  } catch {
    return null
  }
}

const parseJson = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

// Get all products for current seller
export async function getSellerProducts(page = 0, pageSize = 20) {
  try {
    const response = await fetch(`${API_BASE_URL}/products?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const json = await parseJson(response)
    const pageData = json?.result || {}
    return {
      content: pageData.content || [],
      totalPages: pageData.totalPages || 0,
      totalElements: pageData.totalElements || 0,
      number: pageData.number || 0,
    }
  } catch (error) {
    console.error('Error fetching seller products:', error)
    throw error
  }
}

// Create new product
export async function createProduct(productData) {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(productData),
    })

    console.log('Create product response status:', response.status)
    const json = await parseJson(response)
    console.log('Create product response:', json)

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${json?.message || 'Create product failed'}`)
    }

    return json?.result || json
  } catch (error) {
    console.error('Error creating product:', error)
    throw error
  }
}

// Update product
export async function updateProduct(productId, productData) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(productData),
    })

    console.log('Update product response status:', response.status)
    const json = await parseJson(response)

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${json?.message || 'Update product failed'}`)
    }

    return json?.result || json
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

// Delete product
export async function deleteProduct(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const json = await parseJson(response)
    return json
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}
