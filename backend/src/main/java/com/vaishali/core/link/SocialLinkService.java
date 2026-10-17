package com.vaishali.core.link;

import com.vaishali.core.common.CrudService;
import org.springframework.stereotype.Service;

@Service
public class SocialLinkService extends CrudService<SocialLink> {
    public SocialLinkService(SocialLinkRepository repository) {
        super(repository, "Link");
    }
}