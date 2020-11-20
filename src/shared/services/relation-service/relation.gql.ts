import { gql } from 'apollo-boost';

export const FETCH_COLLECTION_RELATIONS_BY_OBJECTS = gql`
	query getCollectionRelationsByObject(
		$objectIds: [uuid!]!
		$relationType: lookup_enum_relation_types_enum!
	) {
		app_collection_relations(
			where: { object: { _in: $objectIds }, predicate: { _eq: $relationType } }
		) {
			id
			object
			subject
			predicate
		}
	}
`;

export const FETCH_ITEM_RELATIONS_BY_OBJECTS = gql`
	query getItemRelationsByObject(
		$objectIds: [uuid!]!
		$relationType: lookup_enum_relation_types_enum!
	) {
		app_item_relations(
			where: { object: { _in: $objectIds }, predicate: { _eq: $relationType } }
		) {
			id
			object
			subject
			predicate
		}
	}
`;

export const FETCH_COLLECTION_RELATIONS_BY_SUBJECTS = gql`
	query getCollectionRelationsBySubject(
		$subjectIds: [uuid!]!
		$relationType: lookup_enum_relation_types_enum!
	) {
		app_collection_relations(
			where: { subject: { _in: $subjectIds }, predicate: { _eq: $relationType } }
		) {
			id
			object
			subject
			predicate
		}
	}
`;

export const FETCH_ITEM_RELATIONS_BY_SUBJECTS = gql`
	query getItemRelationsBySubject(
		$subjectIds: [uuid!]!
		$relationType: lookup_enum_relation_types_enum!
	) {
		app_item_relations(
			where: { subject: { _in: $subjectIds }, predicate: { _eq: $relationType } }
		) {
			id
			object
			subject
			predicate
		}
	}
`;

export const INSERT_COLLECTION_RELATION = gql`
	mutation insertCollectionRelation(
		$objectId: uuid!
		$subjectId: uuid!
		$relationType: lookup_enum_relation_types_enum!
	) {
		insert_app_collection_relations(
			objects: [{ object: $objectId, subject: $subjectId, predicate: $relationType }]
		) {
			returning {
				id
			}
		}
	}
`;

export const INSERT_ITEM_RELATION = gql`
	mutation insertItemRelation(
		$objectId: uuid!
		$subjectId: uuid!
		$relationType: lookup_enum_relation_types_enum!
	) {
		insert_app_item_relations(
			objects: [{ object: $objectId, subject: $subjectId, predicate: $relationType }]
		) {
			returning {
				id
			}
		}
	}
`;

export const DELETE_COLLECTION_RELATIONS_BY_OBJECT = gql`
	mutation deleteItemRelationsByObject(
		$objectId: uuid!
		$relationType: lookup_enum_relation_types_enum!
	) {
		delete_app_collection_relations(
			where: { object: { _eq: $objectId }, predicate: { _eq: $relationType } }
		) {
			affected_rows
		}
	}
`;

export const DELETE_ITEM_RELATIONS_BY_OBJECT = gql`
	mutation deleteItemRelationsByObject(
		$objectId: uuid!
		$relationType: lookup_enum_relation_types_enum!
	) {
		delete_app_item_relations(
			where: { object: { _eq: $objectId }, predicate: { _eq: $relationType } }
		) {
			affected_rows
		}
	}
`;

export const DELETE_COLLECTION_RELATIONS_BY_SUBJECT = gql`
	mutation deleteItemRelationsBySubject(
		$subjectId: uuid!
		$relationType: lookup_enum_relation_types_enum!
	) {
		delete_app_collection_relations(
			where: { subject: { _eq: $subjectId }, predicate: { _eq: $relationType } }
		) {
			affected_rows
		}
	}
`;

export const DELETE_ITEM_RELATIONS_BY_SUBJECT = gql`
	mutation deleteItemRelationsBySubject(
		$subjectId: uuid!
		$relationType: lookup_enum_relation_types_enum!
	) {
		delete_app_item_relations(
			where: { subject: { _eq: $subjectId }, predicate: { _eq: $relationType } }
		) {
			affected_rows
		}
	}
`;
