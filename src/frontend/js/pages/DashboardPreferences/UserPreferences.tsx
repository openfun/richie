import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AuthenticationApi } from 'api/authentication';
import { useSession } from 'contexts/SessionContext';

const UserPreferences = () => {
  const { user } = useSession();
  const [profile, setProfile] = useState(null);
  const queryClient = useQueryClient();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const payload = formData
      .keys()
      .reduce((acc, key) => ({ ...acc, [key]: formData.get(key) }), {});

    await AuthenticationApi.account.update(user?.username, payload);
    await queryClient.invalidateQueries({ queryKey: ['user'] });
    return false;
  };

  useEffect(() => {
    if (!user) return;
    AuthenticationApi.account.get(user?.username).then(setProfile);
  }, [user]);

  return (
    <div>
      <h1>User Preferences</h1>
      <p>Here you can set your preferences.</p>
      {profile && <pre>{JSON.stringify(profile, undefined, 2)}</pre>}
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" />
        <input type="text" name="bio" placeholder="Bio" />
        <input type="submit" />
      </form>
    </div>
  );
};

export default UserPreferences;
