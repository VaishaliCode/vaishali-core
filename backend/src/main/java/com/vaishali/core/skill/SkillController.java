package com.vaishali.core.skill;

import com.vaishali.core.common.CrudController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/skills")
public class SkillController extends CrudController<Skill> {
    public SkillController(SkillService service) {
        super(service);
    }
}