// Cookie management utility functions

export const setCookie = async (name: string, value: any, expiresDays: number = 7): Promise<boolean> => {
  try {
    // Ensure value is not too large (max 3000 chars for safety)
    const stringValue = JSON.stringify(value);
    if (stringValue.length > 3000) {
      console.warn('Cookie value too large, truncating or compressing');
      // Store large data in localStorage
      if (value.proof_file_data && value.proof_file_data.length > 1000) {
        // Store large data in localStorage with unique ID
        const largeDataId = `large_data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(largeDataId, value.proof_file_data);
        
        // Store only metadata in cookie
        value.large_data_id = largeDataId;
        value.proof_file_data = undefined; // Remove from cookie
        value.has_large_proof = true;
      }
    }

    const response = await fetch('/api/cookies/set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        value,
        expiresDays
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to set cookie');
    }

    return true;
  } catch (error) {
    console.error('Error setting cookie:', error);
    return false;
  }
};

export const getCookie = async (name: string): Promise<any> => {
  try {
    const response = await fetch(`/api/cookies/get?name=${encodeURIComponent(name)}`);
    
    if (!response.ok) {
      throw new Error('Failed to get cookie');
    }

    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error('Error getting cookie:', error);
    return null;
  }
};

export const deleteCookie = async (name: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/cookies/delete?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete cookie');
    }

    return true;
  } catch (error) {
    console.error('Error deleting cookie:', error);
    return false;
  }
};

// Track draft review IDs in a separate cookie
export const trackDraftId = async (businessId: string): Promise<boolean> => {
  try {
    const existingIds = await getCookie('draft_review_ids') || [];
    
    if (!Array.isArray(existingIds)) {
      // Reset if corrupted
      await setCookie('draft_review_ids', [businessId], 30);
    } else if (!existingIds.includes(businessId)) {
      existingIds.push(businessId);
      await setCookie('draft_review_ids', existingIds, 30);
    }
    
    return true;
  } catch (error) {
    console.error('Error tracking draft ID:', error);
    return false;
  }
};

export const removeDraftId = async (businessId: string): Promise<boolean> => {
  try {
    const existingIds = await getCookie('draft_review_ids') || [];
    
    if (Array.isArray(existingIds)) {
      const filteredIds = existingIds.filter(id => id !== businessId);
      await setCookie('draft_review_ids', filteredIds, 30);
    }
    
    return true;
  } catch (error) {
    console.error('Error removing draft ID:', error);
    return false;
  }
};