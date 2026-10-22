package com.vaishali.core.profile;

import com.vaishali.core.common.CrudService;
import org.springframework.stereotype.Service;

@Service
public class ProfileService extends CrudService<Profile> {
    public ProfileService(ProfileRepository repository) {
        super(repository, "Profile");
    }
}
