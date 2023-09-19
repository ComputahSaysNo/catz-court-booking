import graphene
from app import queries, mutations

schema = graphene.Schema(query=queries.Query, mutation=mutations.Mutation)