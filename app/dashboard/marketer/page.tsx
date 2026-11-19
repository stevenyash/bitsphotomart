'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign,
  Users,
  TrendingUp,
  Copy,
  Check,
  Link as LinkIcon,
  Wallet,
  UserPlus,
  Clock,
  Gift,
  Share2
} from 'lucide-react';
import { theme } from '@/lib/admin-theme';

interface MarketerProfile {
  id: string;
  referralCode: string;
  department: string | null;
  title: string | null;
  commissionRate: string;
  targetSales: string | null;
  totalSales: string;
  totalCommission: string;
  pendingCommission: string;
  activeClients: number;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  referrals?: Referral[];
}

interface Referral {
  id: string;
  referredUserId: string;
  commissionEarned: string;
  saleAmount: string | null;
  status: string;
  createdAt: string;
  earnedAt: string | null;
  referredUser: {
    name: string | null;
    email: string;
  };
}

export default function MarketerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<MarketerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'settings'>('overview');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'MARKETER') {
      fetchProfile();
    }
  }, [status, session]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/marketer/profile');
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!profile) return;
    const referralLink = `${window.location.origin}/register?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'loading' || loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.secondary}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className={theme.mutedText}>Loading...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'MARKETER') {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.secondary}`}>
        <div className="text-center">
          <h2 className={`text-xl font-semibold ${theme.heading}`}>Access Denied</h2>
          <p className={`${theme.mutedText} mt-2`}>This page is for marketers only.</p>
        </div>
      </div>
    );
  }

  const referralLink = profile ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${profile.referralCode}` : '';

  return (
    <div className={`min-h-screen ${theme.secondary} p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme.heading}`}>Marketer Dashboard</h1>
          <p className={theme.mutedText}>Welcome back, {session.user.name || session.user.email}</p>
        </div>

        {/* Referral Link Card */}
        <div className={`${theme.cardStyle} p-6 mb-6 border-2 border-pink-200`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className={`text-lg font-semibold ${theme.heading} flex items-center gap-2`}>
                <LinkIcon className="w-5 h-5 text-pink-600" />
                Your Referral Link
              </h2>
              <p className={theme.mutedText}>Share this link to earn commission on referred users' purchases</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                readOnly
                value={referralLink}
                className={`flex-1 md:w-80 px-4 py-2 border ${theme.border} rounded-lg bg-gray-500 ${theme.body}`}
              />
              <button
                onClick={copyReferralLink}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${theme.cardStyle} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className={`${theme.mutedText} text-sm`}>Total Earnings</p>
                <p className={`text-xl font-bold ${theme.heading}`}>
                  KES {profile ? parseFloat(profile.totalCommission || '0').toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>
          
          <div className={`${theme.cardStyle} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className={`${theme.mutedText} text-sm`}>Pending</p>
                <p className={`text-xl font-bold ${theme.heading}`}>
                  KES {profile ? parseFloat(profile.pendingCommission || '0').toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>

          <div className={`${theme.cardStyle} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className={`${theme.mutedText} text-sm`}>Total Sales</p>
                <p className={`text-xl font-bold ${theme.heading}`}>
                  KES {profile ? parseFloat(profile.totalSales || '0').toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>

          <div className={`${theme.cardStyle} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className={`${theme.mutedText} text-sm`}>Referrals</p>
                <p className={`text-xl font-bold ${theme.heading}`}>
                  {profile ? profile.activeClients : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'overview' ? 'bg-pink-600 text-white' : `${theme.secondary} ${theme.body}`
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'referrals' ? 'bg-pink-600 text-white' : `${theme.secondary} ${theme.body}`
            }`}
          >
            Referrals
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'settings' ? 'bg-pink-600 text-white' : `${theme.secondary} ${theme.body}`
            }`}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className={`${theme.cardStyle} p-6`}>
            <h3 className={`text-lg font-semibold ${theme.heading} mb-4`}>Performance Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 ${theme.secondary} rounded-lg`}>
                <p className={`${theme.mutedText} text-sm`}>Commission Rate</p>
                <p className={`text-2xl font-bold text-pink-600`}>{profile?.commissionRate || '10'}%</p>
                <p className={`${theme.mutedText} text-xs`}>of each referred sale</p>
              </div>
              <div className={`p-4 ${theme.secondary} rounded-lg`}>
                <p className={`${theme.mutedText} text-sm`}>Target Sales</p>
                <p className={`text-2xl font-bold ${theme.heading}`}>
                  {profile?.targetSales ? `KES ${parseFloat(profile.targetSales).toLocaleString()}` : 'Not set'}
                </p>
                <p className={`${theme.mutedText} text-xs`}>monthly goal</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className={`${theme.cardStyle} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme.secondary} border-b ${theme.border}`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>User</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Referral Date</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Sale Amount</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Commission</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${theme.mutedText}`}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {profile?.referrals && profile.referrals.length > 0 ? (
                    profile.referrals.map((referral) => (
                      <tr key={referral.id} className={theme.tableRowHover}>
                        <td className="px-4 py-3">
                          <div>
                            <p className={`font-medium ${theme.body}`}>{referral.referredUser.name || 'N/A'}</p>
                            <p className={`text-sm ${theme.mutedText}`}>{referral.referredUser.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className={theme.body}>
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`font-medium text-green-600`}>
                            KES {referral.saleAmount ? parseFloat(referral.saleAmount).toLocaleString() : '0'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className={`font-medium text-purple-600`}>
                            KES {parseFloat(referral.commissionEarned || '0').toLocaleString()}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            referral.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            referral.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {referral.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className={`px-4 py-8 text-center ${theme.mutedText}`}>
                        <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No referrals yet. Share your link to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={`${theme.cardStyle} p-6`}>
            <h3 className={`text-lg font-semibold ${theme.heading} mb-4`}>Your Information</h3>
            <div className="space-y-4">
              <div>
                <p className={`${theme.mutedText} text-sm`}>Name</p>
                <p className={theme.body}>{profile?.user.name || 'Not set'}</p>
              </div>
              <div>
                <p className={`${theme.mutedText} text-sm`}>Email</p>
                <p className={theme.body}>{profile?.user.email}</p>
              </div>
              <div>
                <p className={`${theme.mutedText} text-sm`}>Department</p>
                <p className={theme.body}>{profile?.department || 'Not set'}</p>
              </div>
              <div>
                <p className={`${theme.mutedText} text-sm`}>Title</p>
                <p className={theme.body}>{profile?.title || 'Not set'}</p>
              </div>
              <div>
                <p className={`${theme.mutedText} text-sm`}>Your Code</p>
                <p className={`font-mono ${theme.body}`}>{profile?.referralCode}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
