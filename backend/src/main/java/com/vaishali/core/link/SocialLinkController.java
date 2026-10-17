package com.vaishali.core.link;

import com.vaishali.core.common.CrudController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/links")
public class SocialLinkController extends CrudController<SocialLink> {
    public SocialLinkController(SocialLinkService service) {
        super(service);
    }
}