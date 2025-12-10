import { useState, useCallback } from 'react';

// const API_BASE_URL = 'http://localhost:3001/api';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = `${BASE_URL}/api`;

export default function useUsersCache() {
    const [cache, setCache] = useState({});

    const getUser = useCallback(async (id) => {
        if (!id) return null;
        if (cache[id]) return cache[id];
        try {
            const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, { credentials: 'include' });
            if (!res.ok) return null;
            const user = await res.json();
            setCache(prev => ({ ...prev, [id]: user }));
            return user;
        } catch (e) {
            return null;
        }
    }, [cache]);

    return { getUser, usersCache: cache };
}
