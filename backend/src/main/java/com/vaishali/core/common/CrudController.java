package com.vaishali.core.common;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** GET is public. POST / PUT / DELETE require a valid JWT (see SecurityConfig). */
public abstract class CrudController<T extends BaseEntity> {

    private final CrudService<T> service;

    protected CrudController(CrudService<T> service) {
        this.service = service;
    }

    @GetMapping
    public List<T> all() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public T one(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public T create(@Valid @RequestBody T body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public T update(@PathVariable Long id, @Valid @RequestBody T body) {
        return service.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}