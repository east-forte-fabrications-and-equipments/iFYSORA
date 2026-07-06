import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Building2, 
  Users, 
  UserPlus, 
  Settings,
  BarChart3,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Scissors,
  Palette,
  Briefcase,
  UserCog,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Organization {
  id: string;
  name: string;
  description: string;
  type: string;
  contactEmail: string;
  contactPhone: string;
  address: any;
  members: any[];
  createdAt: string;
}

interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  user: {
    id: string;
    displayName: string;
    email: string;
    phone: string;
  };
}

export default function OrgDashboard() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-orgs' | 'tailor' | 'designer'>('my-orgs');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'TAILOR',
    registrationNumber: '',
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      const data = await response.json();
      if (response.ok) {
        setOrganizations(data.organizations || []);
      } else {
        toast.error(data.error || 'Failed to load organizations');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success('Organization created successfully!');
        setShowCreateModal(false);
        setFormData({
          name: '',
          description: '',
          type: 'TAILOR',
          registrationNumber: '',
          contactEmail: '',
          contactPhone: '',
          address: {
            street: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
          },
        });
        await fetchOrganizations();
      } else {
        toast.error(data.error || 'Failed to create organization');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create organization');
    }
  };

  // Filter organizations based on user role and active tab
  const getFilteredOrganizations = () => {
    const userRole = user?.role;
    
    // If user is a Tailor, show only Tailor organizations
    if (userRole === 'TAILOR') {
      return organizations.filter(org => org.type === 'TAILOR' || org.type === 'BOUTIQUE');
    }
    
    // If user is a Designer, show only Designer/BRAND organizations
    if (userRole === 'DESIGNER') {
      return organizations.filter(org => org.type === 'DESIGNER' || org.type === 'BRAND');
    }
    
    // For ORGANIZATION role, show all based on active tab
    if (userRole === 'ORGANIZATION') {
      switch (activeTab) {
        case 'tailor':
          return organizations.filter(org => org.type === 'TAILOR' || org.type === 'BOUTIQUE');
        case 'designer':
          return organizations.filter(org => org.type === 'DESIGNER' || org.type === 'BRAND');
        default:
          return organizations;
      }
    }
    
    return organizations;
  };

  const filteredOrgs = getFilteredOrganizations();

  // Get role-specific actions
  const getRoleActions = (org: Organization) => {
    const userRole = user?.role;
    const isOwner = org.members?.some(m => m.userId === user?.id && m.role === 'OWNER');
    const isAdmin = org.members?.some(m => m.userId === user?.id && m.role === 'ADMIN');

    // Super Admins and Owners get full control
    if (userRole === 'SUPER_ADMIN' || isOwner) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedOrg(org);
              setShowMembers(true);
            }}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
          >
            <Users className="h-4 w-4" />
            Manage Members
          </button>
          <button
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-700 transition"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      );
    }

    // Admins can manage members but not delete
    if (isAdmin) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedOrg(org);
              setShowMembers(true);
            }}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
          >
            <Users className="h-4 w-4" />
            Manage Members
          </button>
          <button
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-700 transition"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        </div>
      );
    }

    // Regular members/viewers can only view
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setSelectedOrg(org);
            setShowMembers(true);
          }}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
        >
          <Eye className="h-4 w-4" />
          View Members
        </button>
      </div>
    );
  };

  // Get role-specific creation options
  const getCreationOptions = () => {
    const userRole = user?.role;
    
    // Tailors can only create Tailor/Boutique organizations
    if (userRole === 'TAILOR') {
      return ['TAILOR', 'BOUTIQUE'];
    }
    
    // Designers can only create Designer/Brand organizations
    if (userRole === 'DESIGNER') {
      return ['DESIGNER', 'BRAND'];
    }
    
    // Organizations and Super Admins can create any type
    return ['TAILOR', 'DESIGNER', 'BOUTIQUE', 'BRAND', 'OTHER'];
  };

  // Get role-based icon
  const getOrgIcon = (type: string) => {
    switch (type) {
      case 'TAILOR':
      case 'BOUTIQUE':
        return <Scissors className="h-5 w-5 text-indigo-600" />;
      case 'DESIGNER':
      case 'BRAND':
        return <Palette className="h-5 w-5 text-emerald-600" />;
      default:
        return <Building2 className="h-5 w-5 text-slate-600" />;
    }
  };

  // Get role-based badge color
  const getOrgBadgeColor = (type: string) => {
    switch (type) {
      case 'TAILOR':
      case 'BOUTIQUE':
        return 'bg-indigo-100 text-indigo-700';
      case 'DESIGNER':
      case 'BRAND':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  // Render role-specific empty state message
  const getEmptyStateMessage = () => {
    const userRole = user?.role;
    
    switch (userRole) {
      case 'TAILOR':
        return {
          title: 'No Tailor Organizations Yet',
          description: 'Create your tailor shop or boutique to get started',
          buttonText: 'Create Tailor Shop'
        };
      case 'DESIGNER':
        return {
          title: 'No Design Studios Yet',
          description: 'Create your design studio or brand to get started',
          buttonText: 'Create Design Studio'
        };
      default:
        return {
          title: 'No Organizations Yet',
          description: 'Create your first organization to get started',
          buttonText: 'Create Organization'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Loading organizations...</p>
        </div>
      </div>
    );
  }

  const emptyState = getEmptyStateMessage();

  return (
    <div className="max-w-6xl mx-auto my-12">
      {/* Header with role-specific greeting */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {user?.role === 'TAILOR' && 'Tailor Organizations'}
            {user?.role === 'DESIGNER' && 'Design Studios'}
            {user?.role === 'ORGANIZATION' && 'Organizations'}
            {user?.role === 'SUPER_ADMIN' && 'Organization Management'}
          </h2>
          <p className="text-sm text-slate-500">
            {user?.role === 'TAILOR' && 'Manage your tailoring businesses and boutiques'}
            {user?.role === 'DESIGNER' && 'Manage your design studios and brands'}
            {user?.role === 'ORGANIZATION' && 'Manage your professional organizations'}
            {user?.role === 'SUPER_ADMIN' && 'View and manage all organizations in the ecosystem'}
          </p>
        </div>
        
        {/* Role-based action buttons */}
        {user?.role !== 'SUPER_ADMIN' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition"
          >
            <UserPlus className="h-4 w-4" />
            {user?.role === 'TAILOR' && 'New Tailor Shop'}
            {user?.role === 'DESIGNER' && 'New Design Studio'}
            {user?.role === 'ORGANIZATION' && 'New Organization'}
          </button>
        )}
      </div>

      {/* Tabs for Organization role */}
      {user?.role === 'ORGANIZATION' && (
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('my-orgs')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'my-orgs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Briefcase className="inline h-4 w-4 mr-2" />
            All Organizations
          </button>
          <button
            onClick={() => setActiveTab('tailor')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'tailor'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Scissors className="inline h-4 w-4 mr-2" />
            Tailors
          </button>
          <button
            onClick={() => setActiveTab('designer')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === 'designer'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Palette className="inline h-4 w-4 mr-2" />
            Designers
          </button>
        </div>
      )}

      {filteredOrgs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
          <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
            <Building2 className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{emptyState.title}</h3>
          <p className="text-sm text-slate-500 mt-1">{emptyState.description}</p>
          {user?.role !== 'SUPER_ADMIN' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl transition"
            >
              {emptyState.buttonText}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrgs.map((org) => (
            <div key={org.id} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        {getOrgIcon(org.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{org.name}</h3>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getOrgBadgeColor(org.type)}`}>
                          {org.type}
                        </span>
                      </div>
                    </div>
                    
                    {org.description && (
                      <p className="mt-2 text-sm text-slate-500">{org.description}</p>
                    )}
                    
                    <div className="mt-4 space-y-1">
                      {org.contactEmail && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{org.contactEmail}</span>
                        </div>
                      )}
                      {org.contactPhone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{org.contactPhone}</span>
                        </div>
                      )}
                      {org.address?.city && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{org.address.city}, {org.address.state}</span>
                        </div>
                      )}
                    </div>

                    {/* Member count badge */}
                    <div className="mt-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-500">
                        {org.members?.length || 0} member{org.members?.length !== 1 ? 's' : ''}
                      </span>
                      {/* Role badge for the current user */}
                      {org.members?.find(m => m.userId === user?.id) && (
                        <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full">
                          {org.members.find(m => m.userId === user?.id)?.role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-200">
                  {getRoleActions(org)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Organization Modal - with role-specific fields */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {user?.role === 'TAILOR' && 'Create Tailor Shop'}
                {user?.role === 'DESIGNER' && 'Create Design Studio'}
                {user?.role === 'ORGANIZATION' && 'Create Organization'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition"
              >
                <XCircle className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={user?.role === 'TAILOR' ? "My Tailor Shop" : "My Design Studio"}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {getCreationOptions().map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  {user?.role === 'TAILOR' && 'Tailors can create Tailor shops and Boutiques'}
                  {user?.role === 'DESIGNER' && 'Designers can create Design studios and Brands'}
                  {user?.role === 'ORGANIZATION' && 'Organizations can create any type of entity'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Describe your organization"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter registration number"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="contact@org.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="+234 800 000 0000"
                  />
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Street
                    </label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.address.country}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, country: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition"
                >
                  {user?.role === 'TAILOR' ? 'Create Tailor Shop' : 
                   user?.role === 'DESIGNER' ? 'Create Design Studio' : 
                   'Create Organization'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Management Modal - reused */}
      {showMembers && selectedOrg && (
        <MemberManagement
          organizationId={selectedOrg.id}
          organizationName={selectedOrg.name}
          onClose={() => {
            setShowMembers(false);
            setSelectedOrg(null);
          }}
        />
      )}
    </div>
  );
}
```
