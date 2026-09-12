import { useState } from 'react';
import { CustomerLayout } from './layout';
import { useBooking } from '../../lib/context';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { User, Lock } from 'lucide-react';
import { EditProfileModal } from '../../components/customer/edit-profile-modal';
import { showSuccessNotification, showErrorNotification } from '../../lib/notifications';

export default function CustomerSettingsPage() {
  const { currentUser, customerAccounts, changeCustomerPassword } = useBooking();
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileData, setProfileData] = useState({
    firstName: currentUser.firstName || 'John',
    lastName: currentUser.lastName || 'Doe',
    email: currentUser.email || 'john.doe@email.com',
    phone: currentUser.phone || '09123456789',
  });

  const currentCustomerAccount = customerAccounts.find((c) => c.id === currentUser.id);

  const handleSaveProfile = (updatedProfile: any) => {
    setProfileData(updatedProfile);
    showSuccessNotification({
      title: 'Profile Updated',
      description: 'Your profile has been saved successfully.',
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showErrorNotification({
        title: 'Missing Fields',
        description: 'Please fill in all password fields.',
      });
      return;
    }
    if (currentPassword !== currentCustomerAccount?.password) {
      showErrorNotification({
        title: 'Invalid Current Password',
        description: 'The current password you entered is incorrect.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      showErrorNotification({
        title: 'Password Mismatch',
        description: 'New passwords do not match. Please try again.',
      });
      return;
    }
    changeCustomerPassword(currentUser.id, newPassword);
    showSuccessNotification({
      title: 'Password Changed',
      description: 'Your password has been changed successfully.',
    });
    setShowChangePassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <CustomerLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

        <Card className="mb-8 border-l-4 border-blue-500">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
            </div>
            <button
              onClick={() => setIsEditProfileModalOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
            >
              {showChangePassword ? 'Cancel' : 'Change Password'}
            </button>

            {showChangePassword && (
              <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  className="w-full px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Update Password
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EditProfileModal
        profile={profileData}
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSave={handleSaveProfile}
      />
    </CustomerLayout>
  );
}
