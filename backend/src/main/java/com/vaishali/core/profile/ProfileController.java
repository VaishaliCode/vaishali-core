package com.vaishali.core.profile;

import com.vaishali.core.common.CrudController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController extends CrudController<Profile> {
    public ProfileController(ProfileService service) {
        super(service);
    }
}
