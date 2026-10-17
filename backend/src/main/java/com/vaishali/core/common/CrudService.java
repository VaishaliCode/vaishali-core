package com.vaishali.core.common;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public abstract class CrudService<T extends BaseEntity> {

    private static final Sort ORDER = Sort.by("displayOrder").ascending().and(Sort.by("id"));

    protected final JpaRepository<T, Long> repository;
    private final String name;

    protected CrudService(JpaRepository<T, Long> repository, String name) {
        this.repository = repository;
        this.name = name;
    }

    @Transactional(readOnly = true)
    public List<T> findAll() {
        return repository.findAll(ORDER);
    }

    @Transactional(readOnly = true)
    public T findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException(name + " " + id + " not found"));
    }

    @Transactional
    public T create(T entity) {
        entity.setId(null);
        return repository.save(entity);
    }

    @Transactional
    public T update(Long id, T incoming) {
        T existing = findById(id);
        incoming.setId(id);
        incoming.setCreatedAt(existing.getCreatedAt());
        return repository.save(incoming);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException(name + " " + id + " not found");
        }
        repository.deleteById(id);
    }
}