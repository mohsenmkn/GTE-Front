import api from '@/api/axios'

const apiManagementService = {
    async listClients() {
        const { data } = await api.get('api-management/clients')
        return data.clients ?? []
    },
    async createClient(payload) {
        const { data } = await api.post('api-management/clients', payload)
        return data
    },
    async revokeClient(id) {
        const { data } = await api.delete(`api-management/clients/${id}`)
        return data
    },
}

export default apiManagementService
